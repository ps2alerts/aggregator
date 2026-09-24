import {BlockList, isIPv4} from 'net';
import {IncomingHttpHeaders} from 'http';

// Loopback is always allowed for the container's own healthcheck; METRICS_ALLOWED_CIDRS adds the LAN.
export function metricsAllowList(cidrs: string | undefined): BlockList {
    const list = new BlockList();
    list.addSubnet('127.0.0.0', 8, 'ipv4');
    list.addAddress('::1', 'ipv6');

    for (const cidr of (cidrs ?? '').split(',').map((c) => c.trim()).filter(Boolean)) {
        const [address, prefix] = cidr.split('/');
        list.addSubnet(address, parseInt(prefix, 10), isIPv4(address) ? 'ipv4' : 'ipv6');
    }

    return list;
}

export function isMetricsRequestAllowed(allowList: BlockList, ip: string, headers: IncomingHttpHeaders): boolean {
    if (headers['cf-connecting-ip'] || headers['cf-ray']) {
        return false;
    }

    const address = ip.startsWith('::ffff:') ? ip.slice(7) : ip;

    return allowList.check(address, isIPv4(address) ? 'ipv4' : 'ipv6');
}
