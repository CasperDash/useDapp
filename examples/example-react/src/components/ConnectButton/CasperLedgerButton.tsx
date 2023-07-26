import {
  CasperLedgerConnector,
  useConnect,
} from '@casperdash/usewallet';

import { Button } from '../ui/Button';

export const CasperLedgerButton = () => {
  const { connect } = useConnect({
    connector: new CasperLedgerConnector(),
    onError: (err: unknown) => {
      console.log(err);
    },
  });

  return (
    <div>
        <Button onClick={() => connect()} className='w-full'>
          Connect with Ledger
        </Button>
    </div>
  );
};

export default CasperLedgerButton;
