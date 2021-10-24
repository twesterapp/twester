// Converts minutes to `Ad Bh Cm` format where A = days, B = hours, C = mins
export function formatMinutes(mins: number): string {
    const days = Math.floor(mins / 24 / 60);
    const hours = Math.floor((mins / 60) % 24);
    const _mins = Math.floor(mins % 60);

    // 3d 21h 43m
    // `0m` only for `m`. If it's `0h 42m`, we ignore `0h`. Same for `0d`
    let formattedString = '';

    if (days) formattedString += `${days}d`;
    if (hours || (!hours && days)) formattedString += ` ${hours}h`;
    formattedString += ` ${_mins}m`;

    return formattedString;
}
