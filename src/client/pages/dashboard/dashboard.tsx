// import { logout } from "wasp/client/auth";
// import { generateTextToImage, generateImageToImage } from "wasp/client/operations";
import { useRef, useState } from "react";


export const DashboardPage = () => {
    const fileInputRef = useRef(null);
    const [image, setimage] = useState('');

    return (
        <div>
            <img src={image} alt="Uploaded" />
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                    // @ts-ignore
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            // @ts-ignore
                            setimage(reader.result);
                        };
                        reader.readAsDataURL(file);
                    }
                }}
                // className="hidden"
                accept="image/*"
            />
        </div>
    )
};