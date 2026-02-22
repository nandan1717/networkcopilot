import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const schema: Schema = {
    description: "User profile extracted from a resume",
    type: SchemaType.OBJECT,
    properties: {
        name: { type: SchemaType.STRING, description: "The full name of the user" },
        address: { type: SchemaType.STRING, description: "The user's location or address" },
        contact: {
            type: SchemaType.OBJECT,
            properties: {
                email: { type: SchemaType.STRING },
                phone: { type: SchemaType.STRING },
                linkedin: { type: SchemaType.STRING },
                github: { type: SchemaType.STRING },
                website: { type: SchemaType.STRING }
            }
        },
        summary: { type: SchemaType.STRING, description: "A strong professional summary or bio of the user based on their resume" },
        gpa: { type: SchemaType.STRING },
        skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        education: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    school: { type: SchemaType.STRING },
                    degree: { type: SchemaType.STRING },
                    duration: { type: SchemaType.STRING }
                }
            }
        },
        experiences: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    role: { type: SchemaType.STRING },
                    company: { type: SchemaType.STRING },
                    duration: { type: SchemaType.STRING },
                    metrics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Key achievements or impact metrics from this role" }
                }
            }
        },
        projects: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    techStack: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    description: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Key bullet points about the project" }
                }
            }
        },
        volunteer: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    role: { type: SchemaType.STRING },
                    organization: { type: SchemaType.STRING },
                    duration: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING }
                }
            }
        }
    },
    required: ["summary", "skills", "experiences"]
};

export async function POST(req: Request) {
    try {
        // 1. Authenticate with Supabase via Header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        const supabaseAuthClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );

        const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // 2. Fetch the raw_resume from the database
        const { data: profileNode, error: fetchError } = await supabaseAuthClient
            .from('user_profiles')
            .select('raw_resume')
            .eq('id', user.id)
            .single();

        if (fetchError || !profileNode || !profileNode.raw_resume || profileNode.raw_resume.length === 0) {
            return new Response(JSON.stringify({ error: "No persistent resume found to sync." }), { status: 404 });
        }

        const files: string[] = profileNode.raw_resume;

        // --- Security: Initialize Gemini inside handler to avoid module-scope crash ---
        if (!process.env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "API key not configured." }), { status: 500 });
        }
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 3. Setup Gemini Request (No Event Matching)
        const parts = files.map(base64 => ({
            inlineData: {
                data: base64,
                mimeType: "application/pdf"
            }
        }));

        let prompt = `
            You are a senior technical recruiter and resume parser.
            Analyze the attached PDF documents (resume/transcript).
            Extract the data exactly into the required JSON format.
            Extract as many deep details as possible for the projects and experiences to make the profile comprehensive.
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [...parts, { text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        // 4. Update User Profile in DB (Retain raw_resume)
        const { error: profileError } = await supabaseAuthClient.from('user_profiles').upsert({
            id: user.id,
            name: parsed.name,
            address: parsed.address,
            contact: parsed.contact,
            gpa: parsed.gpa,
            skills: parsed.skills,
            summary: parsed.summary,
            experiences: parsed.experiences || [],
            education: parsed.education || [],
            projects: parsed.projects || [],
            volunteer: parsed.volunteer || [],
            raw_resume: files, // retain the object
            updated_at: new Date().toISOString()
        });

        if (profileError) {
            throw profileError;
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('Error syncing profile:', error);
        // --- Security: Never leak internal error details to client ---
        return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), { status: 500 });
    }
}
