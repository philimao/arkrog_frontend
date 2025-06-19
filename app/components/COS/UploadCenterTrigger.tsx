import { openModal } from "~/utils/dom";
import { AttachmentIcon } from "../Icons";

export default function UploadCenterTrigger({
  className,
}: {
  className?: string;
}) {
  return (
    <button className={className} onClick={() => openModal("upload-center")} type="button">
      <AttachmentIcon className="-rotate-45"/>
    </button>
  );
}
