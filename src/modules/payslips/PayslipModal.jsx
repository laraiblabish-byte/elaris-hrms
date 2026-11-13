import React, { useRef } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Printer, Sparkles } from 'lucide-react';
import { formatCurrency, formatDate, getEmployeeDisplayName } from '../../utils/formatters';

export const PayslipModal = ({ isOpen, onClose, payslipData }) => {
  const printRef = useRef(null);

  if (!payslipData) return null;

  const { employee, payroll, payslipId, generatedDate } = payslipData;

  const empName = getEmployeeDisplayName(employee);
  const basic = Number(payroll?.basic_salary) || 0;
  const allowances = Number(payroll?.allowances) || 0;
  const bonus = Number(payroll?.bonus) || 0;
  const deductions = Number(payroll?.deductions) || 0;
  const gross = basic + allowances + bonus;
  const net = Number(payroll?.net_salary) || gross - deductions;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Payslip"
      subtitle={`Reference Document: #${payslipId || payroll?.id || 'REF'}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Action bar for printing */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100 no-print">
          <p className="text-xs text-gray-500 font-medium">
            Official salary voucher issued by Elaris Solutions Payroll Department.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="accent"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              className="font-bold shadow-sm"
            >
              Print / Save as PDF
            </Button>
          </div>
        </div>

        {/* Printable Payslip Card */}
        <div
          ref={printRef}
          className="print-area rounded-2xl bg-white p-6 sm:p-8 border-2 border-gray-200 shadow-sm text-[#2D3250] print:border print:p-4 print:rounded-lg print:text-xs"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#2D3250] pb-4 gap-3 print:pb-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#2D3250] text-[#FFB17A] font-bold print:h-8 print:w-8">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 print:h-4 print:w-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#2D3250] print:text-lg">
                  Elaris<span className="text-[#FFB17A]">Solutions</span>
                </h2>
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#676F9D] font-bold">
                  HR & Payroll Management
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <Badge variant="accent" size="lg" className="font-bold mb-1">
                CONFIDENTIAL PAYSLIP
              </Badge>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Voucher #{payslipId || payroll?.id || '001'}
              </p>
              <p className="text-xs text-gray-500">
                Disbursement Date: {formatDate(payroll?.payment_date || generatedDate)}
              </p>
            </div>
          </div>

          {/* Employee & Organization Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs print:py-2.5 print:gap-3">
            <div className="space-y-1.5">
              <p className="font-bold uppercase tracking-wider text-[#676F9D] text-[10px]">
                Employee Information
              </p>
              <p className="text-base font-extrabold text-[#2D3250]">{empName}</p>
              <p className="text-gray-600">
                <span className="font-semibold text-[#424769]">Staff ID:</span> #{employee?.id || '-'}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-[#424769]">Designation:</span> {employee?.designation || 'Specialist'}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-[#424769]">Department:</span> {employee?.department || 'Operations'}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-[#424769]">Email:</span> {employee?.email || '-'}
              </p>
            </div>

            <div className="space-y-1.5 sm:text-right">
              <p className="font-bold uppercase tracking-wider text-[#676F9D] text-[10px]">
                Payroll Cycle & Organization
              </p>
              <p className="text-sm font-bold text-[#2D3250]">Elaris Solutions Global HR</p>
              <p className="text-gray-600">
                <span className="font-semibold text-[#424769]">Pay Period:</span> {payroll?.month || 'Current Cycle'}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-[#424769]">Status:</span> {payroll?.status || 'Paid'}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-[#424769]">Generated:</span> {formatDate(new Date())}
              </p>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6 print:py-2.5 print:gap-4">
            {/* Earnings */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D3250] mb-3 pb-2 border-b-2 border-emerald-500 flex justify-between">
                <span>Earnings Description</span>
                <span>Amount</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Basic Salary</span>
                  <span className="font-mono font-medium">{formatCurrency(basic)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Performance / Project Bonus</span>
                  <span className="font-mono font-medium">{formatCurrency(bonus)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Allowances (House, Utility, Transport)</span>
                  <span className="font-mono font-medium">{formatCurrency(allowances)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#2D3250] pt-2 border-t border-gray-200">
                  <span>Gross Earnings</span>
                  <span className="font-mono">{formatCurrency(gross)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D3250] mb-3 pb-2 border-b-2 border-rose-500 flex justify-between">
                <span>Deductions Description</span>
                <span>Amount</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Tax Withholding & Social Security</span>
                  <span className="font-mono font-medium">{formatCurrency(deductions * 0.7)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Provident Fund / Insurance</span>
                  <span className="font-mono font-medium">{formatCurrency(deductions * 0.3)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Other Deductions</span>
                  <span className="font-mono font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-rose-600 pt-2 border-t border-gray-200">
                  <span>Total Deductions</span>
                  <span className="font-mono">{formatCurrency(deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary Highlight Bar */}
          <div className="mt-3 rounded-xl bg-gradient-to-r from-[#2D3250] to-[#424769] p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 print:p-2.5 print:mt-2 print:rounded-lg">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-[#FFB17A] print:text-[10px]">
                Net Take-Home Pay
              </p>
              <p className="text-[11px] text-gray-300 print:text-[9px]">
                Gross Earnings minus Total Deductions
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#FFB17A] font-mono tracking-tight print:text-xl">
                {formatCurrency(net)}
              </p>
            </div>
          </div>

          {/* Footer signature line */}
          <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-6 text-center text-xs text-gray-500 print:mt-3.5 print:pt-2 print:text-[10px]">
            <div>
              <div className="border-b border-gray-300 w-40 mx-auto mb-1.5 pb-4 print:pb-2.5"></div>
              <p className="font-semibold text-[#2D3250]">Authorized HR Representative</p>
              <p className="text-[10px] text-gray-400">Elaris Solutions Inc.</p>
            </div>
            <div>
              <div className="border-b border-gray-300 w-40 mx-auto mb-1.5 pb-4 print:pb-2.5"></div>
              <p className="font-semibold text-[#2D3250]">Employee Acknowledgment</p>
              <p className="text-[10px] text-gray-400">Signature on File</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="accent" icon={Printer} onClick={handlePrint} className="font-bold">
            Print Document
          </Button>
        </div>
      </div>
    </Modal>
  );
};
