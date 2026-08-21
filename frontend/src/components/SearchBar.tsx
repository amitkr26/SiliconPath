"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/Input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search opportunities...",
  value: externalValue,
  onChange: externalOnChange,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = externalValue !== undefined;
  const currentValue = isControlled ? externalValue : internalValue;

  const handleChange = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    if (externalOnChange) {
      externalOnChange(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(currentValue);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      <Input
        type="text"
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm placeholder:text-slate-400"
      />
    </form>
  );
}