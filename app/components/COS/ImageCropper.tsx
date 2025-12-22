import React, { useCallback, useState } from "react";
import { styled } from "styled-components";
import Cropper, { type Area } from "react-easy-crop";
import { Button, Select, SelectItem, Slider } from "@heroui/react";
import { createCroppedImage } from "./cropImage";
import type { FileWithPreview } from "~/hooks/useCosUpload";

const StyledOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
`;

const StyledCropArea = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
`;

const StyledControls = styled.div`
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.8);
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr;
`;

const StyledControlRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
`;

const StyledButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  grid-column: span 2;
`;

const StyledLabel = styled.label`
  color: white;
  font-size: 0.875rem;
  min-width: 4rem;
`;

interface ImageCropperProps {
  file: FileWithPreview;
  onClose: () => void;
  onSave: (croppedBlob: Blob) => void;
}

const ASPECT_RATIOS = [
  { value: "1/1", label: "1:1", ratio: 1 },
  { value: "16/9", label: "16:9", ratio: 16 / 9 },
  { value: "4/3", label: "4:3", ratio: 4 / 3 },
];

export default function ImageCropper({
  file,
  onClose,
  onSave,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<string>("1/1");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsSaving(true);
      const croppedBlob = await createCroppedImage(
        file.preview,
        croppedAreaPixels,
      );
      onSave(croppedBlob);
    } catch (error) {
      console.error("裁剪失败:", error);
      alert("裁剪失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const currentAspectRatio =
    ASPECT_RATIOS.find((ar) => ar.value === aspectRatio)?.ratio ?? undefined;

  return (
    <StyledOverlay>
      <StyledCropArea>
        <Cropper
          image={file.preview}
          crop={crop}
          zoom={zoom}
          aspect={currentAspectRatio}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          cropShape="rect"
          showGrid={true}
          zoomSpeed={0.1}
          minZoom={0.5}
          maxZoom={5}
          objectFit="contain"
        />
      </StyledCropArea>

      <StyledControls>
        <StyledControlRow>
          <StyledLabel>裁剪比例</StyledLabel>
          <Select
            radius="none"
            aria-label="裁剪比例"
            selectedKeys={[aspectRatio]}
            onChange={(e) => setAspectRatio(e.target.value)}
            disallowEmptySelection={true}
            className="max-w-xs"
            classNames={{
              trigger: "bg-mid-gray rounded-none",
              popoverContent: "bg-mid-gray rounded-none",
              listbox: "rounded-none",
            }}
          >
            {ASPECT_RATIOS.map((ar) => (
              <SelectItem key={ar.value}>{ar.label}</SelectItem>
            ))}
          </Select>
        </StyledControlRow>

        <StyledControlRow>
          <StyledLabel>缩放</StyledLabel>
          <Slider
            aria-label="缩放"
            size="sm"
            step={0.1}
            minValue={0.5}
            maxValue={5}
            value={zoom}
            onChange={(value) => setZoom(value as number)}
            className="flex-1"
            classNames={{
              base: "max-w-md",
              // filler: "bg-ak-blue",
              // thumb: "bg-ak-blue",
            }}
            style={{ borderInlineStartColor: "red !important" }}
          />
        </StyledControlRow>

        <StyledButtonGroup>
          <Button
            onPress={onClose}
            className="bg-gray-600 text-white rounded-none font-bold"
            isDisabled={isSaving}
          >
            取消
          </Button>
          <Button
            onPress={handleSave}
            className="bg-ak-blue text-black rounded-none font-bold"
            isDisabled={isSaving}
            isLoading={isSaving}
          >
            保存
          </Button>
        </StyledButtonGroup>
      </StyledControls>
    </StyledOverlay>
  );
}
