import { create } from "zustand/index";
import type { RecordType } from "~/types/recordType";

type RecordStore = {
  activeRecord?: RecordType;
  setActiveRecord: (record: RecordType) => void;
  clearActiveRecord: () => void;
};

export const useRecordStore = create<RecordStore>((set) => ({
  activeRecord: undefined,
  setActiveRecord: (record) => {
    set({ activeRecord: record });
  },
  clearActiveRecord: () => {
    set({ activeRecord: undefined });
  },
}));
