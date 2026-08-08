import {
    getToken,
    removeToken,
} from "./authService";

const BACKEND_BASE =
   "http://localhost:8080";
//"https://site--mutespeak-backend--22t95wnlrvvt.code.run";
const NOTIFICATION_API =
    `${BACKEND_BASE}/api/notifications`;

const USER_API =
    `${BACKEND_BASE}/api/users`;

// ---------------------------------------------------------------
// SHARED AUTHENTICATED REQUEST
// ---------------------------------------------------------------

async function authenticatedFetch(
    url,
    options = {}
) {

    const token =
        getToken();

    if (!token) {

        throw new Error(
            "You are not logged in."
        );

    }

    const response =
        await fetch(

            url,

            {

                ...options,

                headers: {

                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,

                    ...options.headers,

                },

            }

        );

    return handleResponse(
        response
    );

}

// ---------------------------------------------------------------
// SHARED RESPONSE HANDLER
// ---------------------------------------------------------------

async function handleResponse(
    response
) {

    if (
        response.status === 401
    ) {

        removeToken();

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }

    if (
        response.status === 204
    ) {

        return null;

    }

    let data = null;

    const text =
        await response.text();

    if (text) {

        try {

            data =
                JSON.parse(text);

        } catch {

            data = text;

        }

    }

    if (!response.ok) {

        if (
            response.status === 403
        ) {

            throw new Error(

                data?.message ||

                "You are not allowed to perform this action."

            );

        }

        throw new Error(

            data?.message ||

            "Something went wrong."

        );

    }

    return data;

}

// ---------------------------------------------------------------
// GET ALL NOTIFICATIONS
//
// GET /api/notifications
// ---------------------------------------------------------------

export async function getNotifications() {

    return authenticatedFetch(
        NOTIFICATION_API
    );

}

// ---------------------------------------------------------------
// GET UNREAD COUNT
//
// GET /api/notifications/unread-count
// ---------------------------------------------------------------

export async function getUnreadCount() {

    return authenticatedFetch(
        `${NOTIFICATION_API}/unread-count`
    );

}

// ---------------------------------------------------------------
// MARK SINGLE NOTIFICATION AS READ
//
// PUT /api/notifications/{id}/read
// ---------------------------------------------------------------

export async function markAsRead(
    notificationId
) {

    return authenticatedFetch(

        `${NOTIFICATION_API}/${notificationId}/read`,

        {

            method:
                "PUT",

        }

    );

}

// ---------------------------------------------------------------
// MARK ALL NOTIFICATIONS AS READ
//
// PUT /api/notifications/read-all
// ---------------------------------------------------------------

export async function markAllAsRead() {

    return authenticatedFetch(

        `${NOTIFICATION_API}/read-all`,

        {

            method:
                "PUT",

        }

    );

}

// ---------------------------------------------------------------
// POKE USER
//
// POST /api/users/{userId}/poke
// ---------------------------------------------------------------

export async function pokeUser(
    userId
) {

    return authenticatedFetch(

        `${USER_API}/${userId}/poke`,

        {

            method:
                "POST",

        }

    );

}