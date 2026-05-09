"use client";

import React from "react";

interface Props {
    onDateFromChange: (date: string) => void;
    onDateToChange: (date: string) => void;
    onVehicleClassFilter: (classes: string[]) => void;
    onWeekdayFilter: (weekdays: boolean) => void;
    dateFrom: string;
    dateTo: string;
    vehicleClasses: string[];
    showWeekdaysOnly?: boolean;
}

const VEHICLE_CLASSES = [
    { id: "car", label: "Cars", emoji: "🚗" },
    { id: "bus", label: "Buses", emoji: "🚌" },
    { id: "truck", label: "Trucks", emoji: "🚚" },
    { id: "motorcycle", label: "Motorcycles", emoji: "🏍️" },
    { id: "pedestrian", label: "Pedestrians", emoji: "🚶" },
    { id: "bicycle", label: "Bicycles", emoji: "🚴" },
];

export default function AnalyticsFilters({
    onDateFromChange,
    onDateToChange,
    onVehicleClassFilter,
    onWeekdayFilter,
    dateFrom,
    dateTo,
    vehicleClasses,
    showWeekdaysOnly = false,
}: Props) {
    return (
        <div className="bg-surface-container border border-white/10 rounded-xl p-lg mb-lg">
            <h3 className="font-semibold text-sm mb-md">Filters & Controls</h3>

            <div className="grid grid-cols-4 gap-md">
                {/* Date Range */}
                <div>
                    <label className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">From</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => onDateFromChange(e.target.value)}
                        className="w-full px-2 py-1 bg-surface-container-low border border-white/10 rounded text-on-surface text-sm"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">To</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => onDateToChange(e.target.value)}
                        className="w-full px-2 py-1 bg-surface-container-low border border-white/10 rounded text-on-surface text-sm"
                    />
                </div>

                {/* Weekday Filter */}
                <div>
                    <label className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Period</label>
                    <select
                        value={showWeekdaysOnly ? "weekdays" : "all"}
                        onChange={(e) => onWeekdayFilter(e.target.value === "weekdays")}
                        className="w-full px-2 py-1 bg-surface-container-low border border-white/10 rounded text-on-surface text-sm"
                    >
                        <option value="all">All Days</option>
                        <option value="weekdays">Weekdays Only</option>
                    </select>
                </div>

                {/* Quick Presets */}
                <div>
                    <label className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Quick Range</label>
                    <select
                        onChange={(e) => {
                            const preset = e.target.value;
                            const now = new Date();
                            let from = now;

                            if (preset === "7d") from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            else if (preset === "30d") from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                            else if (preset === "1h") from = new Date(now.getTime() - 60 * 60 * 1000);

                            onDateFromChange(from.toISOString().split("T")[0]);
                            onDateToChange(now.toISOString().split("T")[0]);
                        }}
                        defaultValue=""
                        className="w-full px-2 py-1 bg-surface-container-low border border-white/10 rounded text-on-surface text-sm"
                    >
                        <option value="">— Select —</option>
                        <option value="1h">Last 1 Hour</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
            </div>

            {/* Vehicle Class Filter */}
            <div className="mt-md">
                <label className="text-[10px] text-on-surface-variant uppercase font-bold block mb-2">Vehicle Classes</label>
                <div className="flex flex-wrap gap-2">
                    {VEHICLE_CLASSES.map((vc) => (
                        <button
                            key={vc.id}
                            onClick={() => {
                                const newClasses = vehicleClasses.includes(vc.id)
                                    ? vehicleClasses.filter((c) => c !== vc.id)
                                    : [...vehicleClasses, vc.id];
                                onVehicleClassFilter(newClasses);
                            }}
                            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${vehicleClasses.includes(vc.id) || vehicleClasses.length === 0
                                ? "bg-primary text-on-primary"
                                : "bg-surface-variant text-on-surface-variant hover:bg-surface-container-highest"
                                }`}
                        >
                            {vc.emoji} {vc.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
