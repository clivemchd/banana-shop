import { useState } from "react";


export const FileUploadPage = () => {
    const [myFile, setMyFile] = useState();

    const handleSubmit = () => {

    }
    

    return (
        <div>
            <form onSubmit={handleSubmit}>
            <img 
                src="" 
                style={{
                    height: 300
                }}
            />
            <input
              type="file"
              id="my-file"
              name="my-file"
            //   onChange={(e) => setMyFile(e.target.files[0])}
            />
            <button type="submit">Upload the file</button>
            </form>
        </div>
    )
}