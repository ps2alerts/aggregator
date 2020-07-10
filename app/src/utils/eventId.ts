export default class EventId {
    public static eventIdToZoneId(eventId: number): number {
        switch (eventId) {
            case 1:
                return 2;
            case 2:
                return 6;
            case 3:
                return 4;
            case 4:
                return 8;
            case 7:
                return 4;
            case 8:
                return 4;
            case 9:
                return 4;
            case 10:
                return 2;
            case 11:
                return 2;
            case 12:
                return 2;
            case 13:
                return 6;
            case 14:
                return 6;
            case 15:
                return 8;
            case 16:
                return 8;
            case 17:
                return 8;
            case 31:
                return 2;
            case 32:
                return 6;
            case 33:
                return 4;
            case 34:
                return 8;
            case 123:
            case 124:
            case 125:
                return 2;
            case 126:
            case 127:
            case 128:
                return 6;
            case 129:
            case 130:
            case 131:
                return 8;
            case 132:
            case 133:
            case 134:
                return 4;
        }

        return -1;
    }
}
