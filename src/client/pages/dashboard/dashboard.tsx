import "../../../index.css";
import { logout } from "wasp/client/auth";
// import { generateTextToImage, generateImageToImage } from "wasp/client/operations";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/button";


export const DashboardPage = () => {
    return (
        <div>
            hello world
            <Button onClick={logout}>Logout</Button>
        </div>
    )
};