/* USE SERVICES - CUSTOM HOOK */
/* Loads the public catalog from Supabase and returns the three states every
   screen needs: loading, error and data. reload() tries again after an error. */

import { useCallback, useEffect, useState } from "react";
import { listServices } from "../services/supabase.js";

export function useServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setServices(await listServices());
        } catch (loadError) {
            setError(loadError);
        } finally {
            setLoading(false);
        }
    }, []);

    //Runs once when the component appears on screen.
    useEffect(() => {
        reload();
    }, [reload]);

    return { services, loading, error, reload };
}
