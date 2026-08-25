import { ArrowLeft, RefreshCw, Clock, CheckCircle, AlertCircle, Phone, Mail, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BUSINESS_PHONE } from "../data/deliveryZones";

export default function RefundPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-[#FAFAFA] text-[#111111] pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-[#EAEAEA] sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-[#F5F5F5] hover:bg-[#EEEEEE] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-[#111111] leading-tight">Refund & Cancellation Policy</h1>
            <p className="text-[11px] text-[#666666]">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Intro Card */}
        <div className="bg-white rounded-[20px] p-5 border border-[#EAEAEA] shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-[#00A651]">
            <RefreshCw size={22} className="shrink-0" />
            <h2 className="text-sm font-black uppercase tracking-wider">Transparent & Fair Policies</h2>
          </div>
          <p className="text-xs text-[#555555] leading-relaxed">
            At <strong>Shree Hari Keerai</strong>, we take pride in delivering the highest quality, farm-fresh leafy greens and natural products.
            We understand that circumstances may occasionally arise requiring order cancellation or refund.
            Our policies are designed to be clear, fair, and legally compliant.
          </p>
        </div>

        {/* 1. Order Cancellation Policy */}
        <div className="bg-white rounded-[20px] p-5 border border-[#EAEAEA] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#111111]">
            <Clock size={18} className="text-[#00A651]" />
            <h2 className="text-sm font-bold">1. Order Cancellation Windows</h2>
          </div>
          <div className="space-y-3 text-xs text-[#555555]">
            <div className="bg-[#EAF8F0] p-3.5 rounded-xl border border-[#B9E8CE]">
              <p className="font-bold text-[#087A43] flex items-center gap-1.5 mb-1">
                <CheckCircle size={15} /> Cancellation Before 8:00 PM (Same Day)
              </p>
              <p className="text-[#087A43] leading-relaxed">
                You can cancel your order on the same day it was placed before <strong>8:00 PM</strong> (before farm harvesting and packing begins).
                A <strong>100% full refund</strong> will be initiated immediately to your original payment method.
              </p>
            </div>

            <div className="bg-[#FFF8F0] p-3.5 rounded-xl border border-[#FFE2C2]">
              <p className="font-bold text-[#D97706] flex items-center gap-1.5 mb-1">
                <AlertCircle size={15} /> After 8:00 PM & Morning Dispatch
              </p>
              <p className="text-[#92400E] leading-relaxed">
                Because keerai and leafy greens are freshly harvested perishable goods cut specifically for your order,
                cancellations requested after 8:00 PM or once dispatched for morning delivery cannot be accepted under routine conditions.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Refund Eligibility & Exceptional Conditions */}
        <div className="bg-white rounded-[20px] p-5 border border-[#EAEAEA] shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-[#111111]">2. Exceptional Situations Where Refunds Are Guaranteed</h2>
          <p className="text-xs text-[#555555] leading-relaxed">
            We guarantee a full replacement or 100% refund under any of the following circumstances:
          </p>
          <ul className="text-xs text-[#555555] space-y-2 list-disc pl-5 leading-relaxed">
            <li><strong>Damaged or Spoiled Quality:</strong> If any greens arrive damaged, decayed, or unfit for consumption.</li>
            <li><strong>Incorrect / Missing Items:</strong> If you receive items different from what you ordered or if any product is missing.</li>
            <li><strong>Non-Delivery / Logistics Failure:</strong> If our delivery driver is unable to fulfill your order due to unforeseen logistics or weather constraints.</li>
          </ul>
        </div>

        {/* 3. How to Request a Refund / Replacement */}
        <div className="bg-white rounded-[20px] p-5 border border-[#EAEAEA] shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-[#111111]">3. How to Request a Refund or Replacement</h2>
          <ol className="text-xs text-[#555555] space-y-2 list-decimal pl-5 leading-relaxed">
            <li>Notify our team within <strong>2 hours of delivery</strong> via WhatsApp or phone call.</li>
            <li>Share your <strong>Order ID</strong> and a quick photo of the damaged/incorrect product.</li>
            <li>Our support executive will immediately review and approve your replacement delivery or issue a direct refund.</li>
          </ol>
        </div>

        {/* 4. Refund Processing Timeline */}
        <div className="bg-white rounded-[20px] p-5 border border-[#EAEAEA] shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-[#111111]">4. Refund Timeline & Settlement</h2>
          <p className="text-xs text-[#555555] leading-relaxed">
            Once approved, refunds are processed directly back to the original source account via Razorpay:
          </p>
          <ul className="text-xs text-[#555555] space-y-1.5 list-disc pl-5 leading-relaxed">
            <li><strong>UPI (Google Pay, PhonePe, Paytm):</strong> 1 – 2 business days.</li>
            <li><strong>Debit / Credit Cards & Netbanking:</strong> 3 – 5 business days (depending on your bank).</li>
          </ul>
        </div>

        {/* 5. Contact Information */}
        <div className="bg-white rounded-[20px] p-5 border border-[#EAEAEA] shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-[#111111]">5. Contact Us for Cancellations & Claims</h2>
          <div className="bg-[#F9F9F9] rounded-xl p-3.5 space-y-2 text-xs">
            <p className="font-bold text-[#111111]">🌿 Shree Hari Keerai Customer Support</p>
            <p className="flex items-center gap-2 text-[#555555]">
              <MapPin size={14} className="text-[#00A651]" /> Coimbatore, Tamil Nadu, India
            </p>
            <p className="flex items-center gap-2 text-[#555555]">
              <Phone size={14} className="text-[#00A651]" />
              <a href={`tel:${BUSINESS_PHONE}`} className="text-[#00A651] font-semibold">{BUSINESS_PHONE}</a> (Available 6 AM – 8 PM)
            </p>
            <p className="flex items-center gap-2 text-[#555555]">
              <Mail size={14} className="text-[#00A651]" />
              <a href="mailto:shreeharikeerai1@gmail.com" className="text-[#00A651] font-semibold">shreeharikeerai1@gmail.com</a>
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-[#666666]">
          <Link to="/privacy-policy" className="hover:text-[#00A651] underline">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms-and-conditions" className="hover:text-[#00A651] underline">Terms & Conditions</Link>
        </div>
      </main>
    </div>
  );
}
