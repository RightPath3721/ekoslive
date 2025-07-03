import React, { forwardRef, useCallback, useImperativeHandle, useMemo } from "react";
import { useDropzone } from "react-dropzone";

const Dropzone = forwardRef(({ onFocus, isFocused, imageHandler }, ref) =>
{
    const onDropRejected = useCallback((fileRejections) =>
    {
        console.error(fileRejections[0].errors);
    }, []);

    const onDrop = useCallback((acceptedFiles) =>
    {
        if (!acceptedFiles || !Array.isArray(acceptedFiles)) return;
        acceptedFiles.forEach((file) =>
        {
            const reader = new FileReader();

            reader.onload = () =>
            {
                imageHandler({
                    imageName: file.name,
                    imageType: file.type,
                    imageSize: file.size,
                    imageValue: reader.result,
                });
            };
            reader.readAsDataURL(file);
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop, onDropRejected, accept: {
            "application/octet-stream": [".fits", ".esl", ".esq"],
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
        }
    });

    useImperativeHandle(ref, () =>
    {
        return open;
    }, [open]);

    const style = useMemo(() => ({
        position: "absolute",
        inset: 0,
        zIndex: isFocused ? -1 : 0,
        cursor: "text",
        borderRadius: "4px",
        ...(isDragActive ? {
            background: "rgba(255, 255, 255, 0.2)",
        } : {})
    }), [isFocused, isDragActive]);

    return (
        <div {...getRootProps({ style })} onClick={onFocus}>
            <input {...getInputProps()} />
        </div>
    )
});

export default Dropzone