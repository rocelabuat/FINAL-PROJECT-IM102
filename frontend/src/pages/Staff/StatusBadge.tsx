// src/staff/StatusBadge.tsx
import React from "react";

interface StatusBadgeProps {
  status: string;
}

const StatusBadgeComponent: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = "bg-gray-300 text-gray-800";

  switch (status) {
    case "pending":
      bgColor = "bg-yellow-200 text-yellow-800";
      break;
    case "preparing":
      bgColor = "bg-orange-200 text-orange-800";
      break;
    case "ready":
      bgColor = "bg-blue-200 text-blue-800";
      break;
    case "delivered":
      bgColor = "bg-indigo-200 text-indigo-800";
      break;
    case "paid":
      bgColor = "bg-green-200 text-green-800";
      break;
    case "unverified":
      bgColor = "bg-red-200 text-red-800";
      break;
    case "cancelled":
      bgColor = "bg-gray-500 text-white";
      break;
  }

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-semibold ${bgColor}`}>
      {status.toUpperCase()}
    </span>
  );
};

export const StatusBadge = React.memo(StatusBadgeComponent);
