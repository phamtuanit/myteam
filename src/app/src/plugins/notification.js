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

        Notification.requestPermission().then((permission) => {
            this.isGranted = permission == "granted";
        });
    }

    notify(title, body, icon) {
        if (!this.isGranted) {
            return;
        }

        if (!("Notification" in window)) {
            alert("body");
            return;
        }

        const options = {
            body: body,
            icon: icon,
        };
        
        const id = new Date().getTime();
        const notification = new Notification(title, options);

        this.notificationDict[id] = notification;
        // Handle close event to clean mapping
        notification.onclose = () => {
            delete this.notificationDict[id];
        };

        return id;
    }

    clear(id) {
        if (!this.notificationDict[id]) {
            return;
        }

        delete this.notificationDict[id];
        return true;
    }
};
