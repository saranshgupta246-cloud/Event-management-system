import { useCallback, useEffect, useState } from "react";
import { getClub, getMembers } from "../services/clubService";

export function useClub(clubId) {
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [coreTeam, setCoreTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClub = useCallback(async () => {
    if (!clubId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await getClub(clubId);
      if (res?.success && res?.data) {
        setClub(res.data);
      } else {
        setError(res?.message || "Failed to load club");
      }
    } catch (err) {
      setError(err?.message || "Failed to load club");
    } finally {
      setIsLoading(false);
    }
  }, [clubId]);

  const fetchMembers = useCallback(async () => {
    if (!clubId) return;
    try {
      const res = await getMembers(clubId);
      if (res?.success && Array.isArray(res?.data)) {
        setMembers(res.data);
        const core = (res.data || []).filter(
          (m) => m.roleRank <= 4 || ["President", "Secretary", "Treasurer", "Core Member"].includes(m.role)
        );
        setCoreTeam(core);
      }
    } catch {
      // ignore
    }
  }, [clubId]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  useEffect(() => {
    if (club) fetchMembers();
  }, [club, fetchMembers]);

  return {
    club,
    members,
    coreTeam,
    isLoading,
    error,
    refetch: () => {
      fetchClub();
      fetchMembers();
    },
  };
}
