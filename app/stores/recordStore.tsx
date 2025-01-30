import { create } from "zustand/index";
import type { RecordType } from "~/types/recordType";

type RecordStore = {
  activeRecord: RecordType | null;
  setActiveRecord: (record: RecordType) => void;
  clearActiveRecord: () => void;
};

export const useRecordStore = create<RecordStore>((set) => ({
  activeRecord: null,
  setActiveRecord: (record) => {
    set({ activeRecord: record });
  },
  clearActiveRecord: () => {
    set({ activeRecord: null });
  },
}));
