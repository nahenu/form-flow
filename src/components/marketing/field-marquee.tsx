import {
  AtSign,
  Calendar,
  ChevronsUpDown,
  GitBranch,
  ListChecks,
  MapPin,
  Paperclip,
  Phone,
  Star,
  Type,
} from "lucide-react";
import { Marquee } from "@/components/ui/marquee";

const fields = [
  { icon: Type, label: "Short text" },
  { icon: AtSign, label: "Email" },
  { icon: Phone, label: "Phone + OTP" },
  { icon: MapPin, label: "City picker" },
  { icon: ListChecks, label: "Multiple choice" },
  { icon: ChevronsUpDown, label: "Dropdown" },
  { icon: Calendar, label: "Date" },
  { icon: Star, label: "Rating" },
  { icon: Paperclip, label: "File upload" },
  { icon: GitBranch, label: "Conditional logic" },
];

export function FieldMarquee() {
  return (
    <div className="relative mx-auto mt-14 max-w-6xl px-5">
      <p className="text-center text-sm font-semibold text-muted-foreground">Every field a lead form needs, and nothing it doesn&apos;t</p>
      <div className="relative mt-5 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <Marquee pauseOnHover className="[--duration:45s] [--gap:0.75rem]">
          {fields.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary"
            >
              <Icon className="size-4 text-primary/60" />
              {label}
            </span>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
