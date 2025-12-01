import { openModal } from "~/utils/dom";
import { AttachmentIcon } from "../Icons";

export default function UploadCenterTrigger({
  className,
  beforeOpen: beforeOpen,
}: {
  className?: string;
  beforeOpen?: () => boolean;
}) {
  return (
    <button
      className={className}
      onClick={() => {
        if (!beforeOpen || beforeOpen()) {
          openModal("upload-center");
        }
      }}
      type="button"
    >
      <AttachmentIcon className="-rotate-45" />
    </button>
  );
}
