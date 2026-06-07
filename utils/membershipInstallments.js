const MEMBERSHIP_INSTALLMENT_AMOUNTS = [5000, 5000, 3500];
const MEMBERSHIP_TOTAL_FEE = 13500;

function getMembershipTotalFee(envValue) {
  const parsed = Number.parseInt(String(envValue || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : MEMBERSHIP_TOTAL_FEE;
}

function buildInstallmentSchedule(approvedPaidTotal) {
  const approvedPaid = Math.max(0, Number(approvedPaidTotal) || 0);
  let allocationPool = approvedPaid;

  const installments = MEMBERSHIP_INSTALLMENT_AMOUNTS.map((amount, index) => {
    const paid = Math.min(allocationPool, amount);
    allocationPool = Math.max(0, allocationPool - paid);

    return {
      number: index + 1,
      title: `Installment ${index + 1}`,
      amount,
      installmentPaid: paid,
      installmentRemaining: Math.max(0, amount - paid),
      installmentStatus: 'LOCKED',
      locked: true
    };
  });

  const firstOpenIndex = installments.findIndex((installment) => installment.installmentPaid < installment.amount);

  if (firstOpenIndex === -1) {
    installments.forEach((installment) => {
      installment.installmentStatus = 'COMPLETED';
      installment.installmentPaid = installment.amount;
      installment.installmentRemaining = 0;
      installment.locked = false;
    });

    return {
      installments,
      activeInstallmentNumber: null,
      activeInstallmentRemaining: 0,
      allComplete: true
    };
  }

  installments.forEach((installment, index) => {
    if (index < firstOpenIndex) {
      installment.installmentStatus = 'COMPLETED';
      installment.installmentPaid = installment.amount;
      installment.installmentRemaining = 0;
      installment.locked = false;
      return;
    }

    if (index === firstOpenIndex) {
      installment.locked = false;
      if (installment.installmentPaid >= installment.amount) {
        installment.installmentStatus = 'COMPLETED';
      } else if (installment.installmentPaid > 0) {
        installment.installmentStatus = 'PARTIALLY PAID';
      } else {
        installment.installmentStatus = 'DUE';
      }
      return;
    }

    installment.installmentStatus = 'LOCKED';
    installment.locked = true;
  });

  const activeInstallment = installments[firstOpenIndex];

  return {
    installments,
    activeInstallmentNumber: activeInstallment.number,
    activeInstallmentRemaining: activeInstallment.installmentRemaining,
    allComplete: false
  };
}

function getActiveInstallmentContext(approvedPaidTotal) {
  return buildInstallmentSchedule(approvedPaidTotal);
}

module.exports = {
  MEMBERSHIP_INSTALLMENT_AMOUNTS,
  MEMBERSHIP_TOTAL_FEE,
  getMembershipTotalFee,
  buildInstallmentSchedule,
  getActiveInstallmentContext
};
