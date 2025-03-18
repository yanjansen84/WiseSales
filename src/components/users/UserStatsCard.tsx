import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserStatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

const UserStatsCard = ({ title, value, icon: Icon, color }: UserStatsCardProps) => {
  const getGradient = (color: string) => {
    switch (color) {
      case "blue":
        return "from-blue-500 to-blue-600";
      case "purple":
        return "from-purple-500 to-purple-600";
      case "pink":
        return "from-pink-500 to-pink-600";
      case "green":
        return "from-green-500 to-green-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600 bg-blue-100";
      case "purple":
        return "text-purple-600 bg-purple-100";
      case "pink":
        return "text-pink-600 bg-pink-100";
      case "green":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Card className={cn(
      "border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden",
      "bg-gradient-to-br from-white to-gray-50"
    )}>
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <h4 className="text-2xl md:text-3xl font-bold mt-1 text-gray-800">{value}</h4>
            </div>
            <div className={cn("rounded-xl p-3", getIconColor(color))}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className={cn("h-1.5 w-full bg-gradient-to-r", getGradient(color))}></div>
      </CardContent>
    </Card>
  );
};

export default UserStatsCard;
