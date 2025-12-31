"use client"

import { UserProfile } from "./user-profile"

interface DashboardHomeProps {
    currentUser: any
    onUserUpdate?: (updatedUser: any) => void
}

export function DashboardHome({ currentUser, onUserUpdate }: DashboardHomeProps) {
    const handleUserUpdate = (updatedUser: any) => {
        if (onUserUpdate) {
            onUserUpdate(updatedUser)
        }
    }

    return (
        <UserProfile userInfo={currentUser} onUserUpdate={handleUserUpdate} />
    )
}
