'use client';
import { useState, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, MapPin, Calendar, DollarSign, GraduationCap, Mic, Locate, Loader2, MessageSquare } from 'lucide-react';

export type Filters = {
    radiusKm: number;
    dateFrom: string;
    dateTo: string;
    budget: 'free' | 'under25' | 'under50' | 'any';
    careerStage: 'student' | 'junior' | 'mid-level' | null;
    pitchTone: 'formal' | 'casual' | 'bold';
    userCity: string;
    userCoords: { lat: number; lng: number } | null;
    customPrompt: string;
};

const RADIUS_STEPS = [5, 10, 25, 50, 100];

function getDefaultDateFrom() {
    return new Date().toISOString().split('T')[0];
}

function getDefaultDateTo() {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
}

export function getDefaultFilters(): Filters {
    return {
        radiusKm: 25,
        dateFrom: getDefaultDateFrom(),
        dateTo: getDefaultDateTo(),
        budget: 'any',
        careerStage: null,
        pitchTone: 'casual',
        userCity: '',
        userCoords: null,
        customPrompt: '',
    };
}

const budgetOptions = [
    { value: 'free', label: 'Free' },
    { value: 'under25', label: '< $25' },
    { value: 'under50', label: '< $50' },
    { value: 'any', label: 'Any' },
] as const;

const careerOptions = [
    { value: 'student', label: 'Student' },
    { value: 'junior', label: 'Junior' },
    { value: 'mid-level', label: 'Mid-level' },
] as const;

const toneOptions = [
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'bold', label: 'Bold' },
] as const;

export function FilterPanel({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
    const [open, setOpen] = useState(false);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState('');

    const radiusIndex = RADIUS_STEPS.indexOf(filters.radiusKm);

    // Auto-request location on mount if not already set
    useEffect(() => {
        if (!filters.userCity && !filters.userCoords) {
            requestLocation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser.');
            return;
        }

        setLocating(true);
        setLocationError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Reverse geocode to get city name
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
                    );
                    const data = await res.json();
                    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Your Area';
                    onChange({
                        ...filters,
                        userCity: city,
                        userCoords: { lat: latitude, lng: longitude },
                    });
                } catch {
                    // Fallback: use coords without city name
                    onChange({
                        ...filters,
                        userCity: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
                        userCoords: { lat: latitude, lng: longitude },
                    });
                }
                setLocating(false);
            },
            (error) => {
                setLocating(false);
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError('Location access denied. You can enter your city manually.');
                } else {
                    setLocationError('Could not determine your location. Please enter it manually.');
                }
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
    };

    return (
        <div className="w-full">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.07] transition-all duration-300 group cursor-pointer"
            >
                <div className="flex items-center gap-2.5 text-sm font-medium text-gray-300 group-hover:text-emerald-400 transition-colors">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                    {/* Active filter count badge */}
                    {(() => {
                        let count = 0;
                        if (filters.radiusKm !== 25) count++;
                        if (filters.budget !== 'any') count++;
                        if (filters.careerStage) count++;
                        if (filters.pitchTone !== 'casual') count++;
                        if (filters.dateFrom !== getDefaultDateFrom() || filters.dateTo !== getDefaultDateTo()) count++;
                        return count > 0 ? (
                            <span className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full">{count} active</span>
                        ) : null;
                    })()}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="mt-3 p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">

                    {/* Networking Goals */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-500">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-500/70" />
                            Networking Goals
                        </label>
                        <textarea
                            value={filters.customPrompt}
                            onChange={e => onChange({ ...filters, customPrompt: e.target.value })}
                            placeholder="Customize your networking goals... (e.g. 'I am looking for early-stage AI startups hiring founding engineers.')"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 placeholder:text-gray-600 outline-none focus:border-emerald-500/50 transition-colors resize-none h-20"
                        />
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500/70" />
                            Your Location
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={filters.userCity}
                                    onChange={e => onChange({ ...filters, userCity: e.target.value })}
                                    placeholder="Enter your city..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 outline-none focus:border-emerald-500/50 transition-colors"
                                />
                            </div>
                            <button
                                onClick={requestLocation}
                                disabled={locating}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                            >
                                {locating ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Locating...</>
                                ) : (
                                    <><Locate className="w-3.5 h-3.5" /> Use My Location</>
                                )}
                            </button>
                        </div>
                        {locationError && (
                            <p className="text-xs text-amber-400/80">{locationError}</p>
                        )}
                    </div>

                    {/* Location Radius */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500/70" />
                            Radius
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={0}
                                max={RADIUS_STEPS.length - 1}
                                value={radiusIndex >= 0 ? radiusIndex : 2}
                                onChange={e => onChange({ ...filters, radiusKm: RADIUS_STEPS[Number(e.target.value)] })}
                                className="flex-1 h-1.5 rounded-full appearance-none bg-white/10 accent-emerald-500 cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30 [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                            />
                            <span className="text-sm font-semibold text-emerald-400 min-w-[5.5rem] text-right tabular-nums">
                                {filters.userCity || 'You'} + {filters.radiusKm} km
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-600 px-0.5">
                            {RADIUS_STEPS.map(s => (
                                <span key={s} className={filters.radiusKm === s ? 'text-emerald-500 font-bold' : ''}>{s} km</span>
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500/70" />
                            Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <span className="absolute top-1/2 -translate-y-1/2 left-3 text-[10px] uppercase tracking-wider text-gray-600 font-bold pointer-events-none">From</span>
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 pl-14 py-2.5 text-sm text-gray-300 outline-none focus:border-emerald-500/50 transition-colors [color-scheme:dark]"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute top-1/2 -translate-y-1/2 left-3 text-[10px] uppercase tracking-wider text-gray-600 font-bold pointer-events-none">To</span>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 pl-10 py-2.5 text-sm text-gray-300 outline-none focus:border-emerald-500/50 transition-colors [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-500">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500/70" />
                            Budget
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {budgetOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => onChange({ ...filters, budget: opt.value })}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer ${filters.budget === opt.value
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Career Stage */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-500">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-500/70" />
                            Career Stage
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {careerOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => onChange({ ...filters, careerStage: filters.careerStage === opt.value ? null : opt.value })}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer ${filters.careerStage === opt.value
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pitch Tone */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-500">
                            <Mic className="w-3.5 h-3.5 text-emerald-500/70" />
                            Pitch Tone
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {toneOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => onChange({ ...filters, pitchTone: opt.value })}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer ${filters.pitchTone === opt.value
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reset */}
                    <button
                        onClick={() => onChange(getDefaultFilters())}
                        className="text-xs text-gray-500 hover:text-emerald-400 transition-colors underline underline-offset-2 cursor-pointer"
                    >
                        Reset all filters
                    </button>
                </div>
            )}
        </div>
    );
}
