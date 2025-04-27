import { supabase } from "../supabase";

// Fetch blocked slots for a specific date
export const fetchBlockedSlots = async (date) => {
    const { data, error } = await supabase
        .from("blocked_slots")
        .select("*")
        .eq("date", date);

    if (error) {
        console.error("Error fetching blocked slots:", error.message);
        return [];
    }

    return data;
};

// Add a blocked slot
export const addBlockedSlot = async ({ date, time, reason }) => {
    const { error } = await supabase
        .from("blocked_slots")
        .insert([{ date, time, reason }]);

    if (error) {
        console.error("Error adding blocked slot:", error.message);
        throw error;
    }
};
