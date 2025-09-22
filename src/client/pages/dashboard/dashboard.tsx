import "../../../index.css";
import { logout } from "wasp/client/auth";
// import { generateTextToImage, generateImageToImage } from "wasp/client/operations";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import Navbar from "../landing/navbar";


export const DashboardPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                <p className="text-muted-foreground mb-6">Welcome to your dashboard!</p>
                {/* Dashboard content goes here */}
                <Button onClick={logout} variant="outline">
                    Logout
                </Button>
            </div>
        </div>
    )
};