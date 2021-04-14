const avatarCategories = ["identicon", "monsterid", "wavatar", "retro", "robohash"];
export const buildAvatarUrl = function buildAvatarUrl(user) {
    if (user.avatarUrl) {
        return user.avatarUrl;
    }

    const userName = user.fullName || user.name || user.userName || user.id;
    const userScore = userName.split('').map(x => x.charCodeAt(0)).reduce((a,b) => a + b);
    const categoryIndex = (userScore % 10) % avatarCategories.length;
    return `https://www.gravatar.com/avatar/${userScore}?d=${avatarCategories[categoryIndex]}&f=y`;
}