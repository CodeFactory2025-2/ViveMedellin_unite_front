import { useEffect, useRef, useState } from "react";

import type { GroupJoinRequest } from "@/lib/groups-api";

type RejectedMap = Record<string, boolean>;
type HandledMap = Record<string, number | null>;

export const useRequestStatus = (joinRequests: GroupJoinRequest[], userId?: string) => {
  const [rejectedGroups, setRejectedGroups] = useState<RejectedMap>({});
  const timeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const handledRef = useRef<HandledMap>({});

  const clearGroup = (groupId: string) => {
    clearTimeout(timeouts.current[groupId]);
    delete timeouts.current[groupId];
    setRejectedGroups((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    delete handledRef.current[groupId];
  };

  const scheduleClear = (groupId: string, delayMs: number = 5000) => {
    clearTimeout(timeouts.current[groupId]);
    timeouts.current[groupId] = setTimeout(() => {
      clearGroup(groupId);
    }, delayMs);
  };

  useEffect(() => {
    if (!userId) {
      setRejectedGroups({});
      handledRef.current = {};
      Object.values(timeouts.current).forEach(clearTimeout);
      return;
    }

    const latestRejected: Record<string, number> = {};
    joinRequests.forEach((request) => {
      if (request.userId === userId && request.status === "rejected") {
        const stamp = request.respondedAt ?? request.createdAt;
        const current = latestRejected[request.groupId];
        if (!current || stamp > current) {
          latestRejected[request.groupId] = stamp;
        }
      }
    });

    Object.entries(latestRejected).forEach(([groupId, stamp]) => {
      if (handledRef.current[groupId] === stamp) {
        return;
      }

      handledRef.current[groupId] = stamp;
      setRejectedGroups((prev) => ({ ...prev, [groupId]: true }));
      scheduleClear(groupId);
    });

    return () => {
      // limpiar timeouts al desmontar
      Object.values(timeouts.current).forEach(clearTimeout);
    };
  }, [joinRequests, userId]);

  const markRejected = (groupId: string) => {
    handledRef.current[groupId] = Date.now();
    setRejectedGroups((prev) => ({ ...prev, [groupId]: true }));
    scheduleClear(groupId);
  };

  const clearRejected = (groupId: string) => {
    clearGroup(groupId);
  };

  return { rejectedGroups, markRejected, clearRejected };
};
