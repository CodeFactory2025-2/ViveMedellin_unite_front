import React from "react";
import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRequestDate } from "@/lib/date-utils";
import type { JoinRequestWithDetails } from "@/lib/groups-api";

interface RequestCardProps {
  request: JoinRequestWithDetails;
  onAccept: (request: JoinRequestWithDetails) => void;
  onReject: (request: JoinRequestWithDetails) => void;
  loading?: "accept" | "reject" | null;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, onAccept, onReject, loading }) => {
  const dateLabel = formatRequestDate(request.createdAt);
  const userLabel = request.userName || request.userEmail || request.userId || "Usuario";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Nueva solicitud para unirse a tu grupo</CardTitle>
          <CardDescription>Fecha y hora: {dateLabel}</CardDescription>
        </div>
        <div className="text-sm font-medium text-primary">{request.groupName}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-foreground">
          {request.userAvatar ? (
            <img
              src={request.userAvatar}
              alt={userLabel}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <UserRound className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          <p className="leading-relaxed">
            El usuario <span className="font-semibold text-foreground">{userLabel}</span> ha solicitado unirse
            al grupo <span className="font-semibold text-foreground">{request.groupName}</span>.
          </p>
        </div>
        {request.message ? (
          <p className="rounded-md border bg-muted/40 p-3 text-sm text-foreground">
            “{request.message}”
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="destructive"
            className="sm:w-auto"
            onClick={() => onReject(request)}
            disabled={loading === "reject"}
          >
            {loading === "reject" ? "Rechazando..." : "Rechazar"}
          </Button>
          <Button
            className="bg-gradient-primary sm:w-auto"
            onClick={() => onAccept(request)}
            disabled={loading === "accept"}
          >
            {loading === "accept" ? "Aceptando..." : "Aceptar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
