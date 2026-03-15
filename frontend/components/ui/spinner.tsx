import React from "react";
import { Loader } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
    return (
        <Loader className={`animate-spin ${className}`} />
    );
    }