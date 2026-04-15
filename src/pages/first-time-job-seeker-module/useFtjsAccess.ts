import { useEffect, useState } from "react";
import {
  ftjsApi,
  type UserAccessPermission,
} from "../../service/first-time-job-seeker-api/FirstTimeJobSeeker";

export function useFtjsAccess() {
  const [accessLoading, setAccessLoading] = useState(true);
  const [userAccess, setUserAccess] = useState<UserAccessPermission | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAccess() {
      try {
        setAccessLoading(true);
        const access = await ftjsApi.getMyAccess();
        if (isMounted) {
          setUserAccess(access);
        }
      } catch (error) {
        console.error("Error fetching FTJS access:", error);
        if (isMounted) {
          setUserAccess(null);
        }
      } finally {
        if (isMounted) {
          setAccessLoading(false);
        }
      }
    }

    loadAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  return { accessLoading, userAccess };
}