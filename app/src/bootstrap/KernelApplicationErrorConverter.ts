import ApplicationException from '../exceptions/ApplicationException';
import EventEmitter = NodeJS.EventEmitter;
import UnhandledRejectionListener = NodeJS.UnhandledRejectionListener;

export default class KernelApplicationErrorConverter {
    public convert(exception:EventEmitter):ApplicationException {
        console.log(typeof(exception))
        if (typeof(exception) === 'UnhandledRejectionListener') {
            this.handleUnhandledRejectionListener(exception)
        }

    }

    private handleUnhandledRejectionListener(exception:UnhandledRejectionListener) {
        return new ApplicationException(
            exception.reason,
            null,
            null
        )

        return new Error()
    }
}
