import { CreditCard, Check, Clock } from 'lucide-react';
import clsx from 'clsx';

interface PaymentStatusProps {
  status: 'pending' | 'completed';
  baseAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  currency?: 'EUR' | 'XOF';
  showRemainingOnly?: boolean;
}

export function PaymentStatus({ 
  status, 
  baseAmount, 
  advanceAmount, 
  remainingAmount,
  currency = 'EUR',
  showRemainingOnly = false
}: PaymentStatusProps) {
  const formatAmount = (amount: number) => {
    if (currency === 'XOF') {
      return Math.round(amount).toLocaleString();
    }
    return amount.toFixed(2);
  };

  const isPaid = status === 'completed' || remainingAmount === 0;
  const hasAdvance = advanceAmount > 0;

  if (showRemainingOnly) {
    if (isPaid) {
      return (
        <div className="flex items-center text-green-600 text-sm font-medium">
          <Check className="h-4 w-4 mr-1" />
          Paid
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-gray-400" />
        <div className="text-sm font-medium text-gray-900">
          {formatAmount(remainingAmount)} {currency}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      "flex items-center space-x-2 text-sm",
      isPaid ? 'text-green-600' : 'text-gray-600'
    )}>
      {isPaid ? (
        <Check className="h-4 w-4 flex-shrink-0" />
      ) : (
        <CreditCard className="h-4 w-4 flex-shrink-0" />
      )}
      <div className="space-y-1">
        <div className="font-medium">
          {isPaid ? (
            <span className="flex items-center">
              Paid
              <span className="text-sm text-gray-500 ml-2">
                ({formatAmount(baseAmount)} {currency})
              </span>
            </span>
          ) : (
            <>
              <div className="text-gray-900">
                Total amount: {formatAmount(baseAmount)} {currency}
              </div>
              {hasAdvance && (
                <>
                  <div className="text-green-600">
                    Advance payment: {formatAmount(advanceAmount)} {currency}
                  </div>
                  <div className="text-red-600">
                    Remaining: {formatAmount(remainingAmount)} {currency}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}