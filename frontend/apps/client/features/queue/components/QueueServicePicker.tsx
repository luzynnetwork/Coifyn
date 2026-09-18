"use client";

import type { ServiceView } from "@coifyn/api-client";

export interface QueueServicePickerProps {
  services: ServiceView[];
  selected: string[];
  onChange: (serviceIds: string[]) => void;
}

export function QueueServicePicker({ services, selected, onChange }: QueueServicePickerProps) {
  function toggle(serviceId: string) {
    onChange(
      selected.includes(serviceId)
        ? selected.filter((id) => id !== serviceId)
        : [...selected, serviceId],
    );
  }

  return (
    <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
      {services
        .filter((service) => service.isActive)
        .map((service) => (
          <label key={service.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(service.id)}
              onChange={() => toggle(service.id)}
            />
            {service.name}
          </label>
        ))}
    </div>
  );
}
