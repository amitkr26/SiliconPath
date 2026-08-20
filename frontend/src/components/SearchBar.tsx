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
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900" />
      <Input
        type="text"
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </form>
  );
}