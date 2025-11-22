import { create } from "zustand/index";
import type { RecordType } from "~/types/recordType";
import { devtools } from "zustand/middleware";

type RecordStore = {
  activeRecord?: RecordType;
  setActiveRecord: (record: RecordType) => void;
  clearActiveRecord: () => void;
};

export const useRecordStore = create<RecordStore>()(
  devtools(
    (set) => ({
      activeRecord: undefined,
      setActiveRecord: (record) => {
        set({ activeRecord: record }, undefined, "setActiveRecord");
      },
      clearActiveRecord: () => {
        set({ activeRecord: undefined }, undefined, "clearActiveRecord");
      },
    }),
    { name: "recordStore" },
  ),
);
