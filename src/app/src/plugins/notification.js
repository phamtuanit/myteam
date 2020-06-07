module.exports = class NotificationWrapper {
    constructor() {
        this.notificationDict = {};
        this.isGranted = false;
        if (!("Notification" in window)) {
            this.isGranted = true;
        } else {
            this.isGranted = Notification.permission === "granted";
        }
    }

    requestPermission() {
        if (this.isGranted) {
            return;
        }

        Notification.requestPermission().then(permission => {
            this.isGranted = permission == "granted";
        });
    }

    notify(title, body, icon, data) {
        if (!this.isGranted) {
            return;
        }

        if (!("Notification" in window)) {
            alert(body);
            return;
        }

        const options = {
            body: body,
            icon: icon || "icon.png",
            data: data,
        };

        const id = new Date().getTime();
        const notification = new Notification(title, options);
        notification.id == id;

        this.notificationDict[id] = notification;
        // Handle close event to clean mapping
        notification.onclose = () => {
            this.clear(id);
        };

        // Handle click event
        notification.onclick = event => {
            event.preventDefault();
            this.clear(id);
            const message = event.currentTarget.data;
            if (typeof notification.onOpen === "function") {
                notification.onOpen(event, message);
            }
        };

        return notification;
    }

    clear(id) {
        if (!this.notificationDict[id]) {
            return;
        }

        const notification = this.notificationDict[id];
        notification.close();
        delete this.notificationDict[id];
        return notification;
    }
};
