import { useState } from "react";
import { fetchAdminData } from "../../../shared/api/admin";
import { useOnce } from "../../../utils/useOnce";
import type { AdminApiData } from "../../../types";

export const useData = () => {
  const [store, setState] = useState<AdminApiData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminData();
      setState(data);
    } finally {
      setLoading(false);
    }
  }

  useOnce(() => {
    fetchData();
  }, [])

  return {
    store,
    loading,
    reload: fetchData,
  }
}
