import axios from 'axios';
import { auth } from 'renderer/core/auth';
import { logging } from 'renderer/core/logging';

const log = logging.getLogger('API');

const token = localStorage.getItem('access-token') || '';
const NODE_PORT = '42069';

export const nodeClient = axios.create({
    baseURL: `http://localhost:${NODE_PORT}`,
});

export async function makeGraphqlRequest(
    data: Record<string, unknown>
): Promise<Record<string, any>> {
    return axios({
        method: 'POST',
        url: 'https://gql.twitch.tv/gql',
        headers: {
            'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
            Authorization: `OAuth ${token}`,
        },
        data,
    })
        .then((res) => {
            const data = res.data;
            return data;
        })
        .catch((error) => {
            log.error(
                `Failed to make Twitch GraphQL request [${error?.response?.status}]: ${error?.response?.data?.message}`
            );

            if (
                error.response.status === 401 ||
                error.response.data.error === 'Unauthorized'
            ) {
                // The token has probably expired and there is no way to refresh
                // the token, that's why we signout the user.
                auth.signout();
            }
        });
}
