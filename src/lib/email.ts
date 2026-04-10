import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_placeholder");
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "PipZen Partners <noreply@pipzen.io>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const LOGO_URL = "https://res.cloudinary.com/dxvi5d6dr/image/upload/v1771018260/tr_u4ci1i.png";

function emailWrapper(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PipZen Partners</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #020617; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 0 0 32px;">
              <img src="${LOGO_URL}" alt="PipZen" width="56" height="56" style="display: block; border-radius: 12px;" />
            </td>
          </tr>
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
              <!-- Gold Accent Bar -->
              <div style="height: 4px; background: linear-gradient(90deg, #f59e0b, #d97706, #f59e0b);"></div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 40px 40px 32px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-top: 1px solid #1e293b; padding: 24px 0 0;">
                    <p style="margin: 0 0 8px; color: #475569; font-size: 12px;">PipZen Partner Program</p>
                    <p style="margin: 0; color: #334155; font-size: 11px;">This is an automated message. Please do not reply directly to this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendInviteEmail(email: string, inviteToken: string, referrerName?: string) {
  const registerUrl = `${APP_URL}/register/${inviteToken}`;

  const content = `
    <h1 style="margin: 0 0 8px; color: #f8fafc; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
      You're Invited
    </h1>
    <p style="margin: 0 0 28px; color: #94a3b8; font-size: 15px; line-height: 1.5;">
      ${referrerName
        ? `<span style="color: #f59e0b; font-weight: 600;">${referrerName}</span> has invited you to join the PipZen Partner Program.`
        : "You've been invited to join the PipZen Partner Program."
      }
    </p>

    <!-- Benefits -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px;">
      <tr>
        <td style="padding: 16px; background-color: #0f172a; border-radius: 10px; border: 1px solid #1e293b;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 6px 0;">
                <span style="color: #f59e0b; font-size: 14px; margin-right: 8px;">&#9679;</span>
                <span style="color: #cbd5e1; font-size: 14px;">Earn commissions on every referral in your network</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">
                <span style="color: #f59e0b; font-size: 14px; margin-right: 8px;">&#9679;</span>
                <span style="color: #cbd5e1; font-size: 14px;">Multi-level earnings from your entire team</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">
                <span style="color: #f59e0b; font-size: 14px; margin-right: 8px;">&#9679;</span>
                <span style="color: #cbd5e1; font-size: 14px;">Track performance with a real-time dashboard</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px;">
      <tr>
        <td align="center">
          <a href="${registerUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0f172a; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 10px; letter-spacing: 0.3px;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>

    <!-- Expiry notice -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 16px; background-color: rgba(245, 158, 11, 0.06); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.15);">
          <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
            <span style="color: #f59e0b; font-weight: 600;">Note:</span> This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
          </p>
        </td>
      </tr>
    </table>
  `;

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "You've been invited to join PipZen Partners!",
    html: emailWrapper(content),
  });

  if (error) {
    console.error("Resend invite email error:", error);
    throw new Error(error.message || "Failed to send invite email");
  }
}

export async function sendWithdrawalStatusEmail(
  email: string,
  status: "APPROVED" | "REJECTED",
  amount: number,
  adminNote?: string
) {
  const isApproved = status === "APPROVED";

  const statusColor = isApproved ? "#34d399" : "#f87171";
  const statusBg = isApproved ? "rgba(52, 211, 153, 0.08)" : "rgba(248, 113, 113, 0.08)";
  const statusBorder = isApproved ? "rgba(52, 211, 153, 0.2)" : "rgba(248, 113, 113, 0.2)";
  const statusIcon = isApproved ? "&#10003;" : "&#10007;";

  const content = `
    <h1 style="margin: 0 0 8px; color: #f8fafc; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
      Withdrawal ${isApproved ? "Approved" : "Rejected"}
    </h1>
    <p style="margin: 0 0 28px; color: #94a3b8; font-size: 15px; line-height: 1.5;">
      Your withdrawal request has been ${isApproved ? "approved" : "rejected"} by the admin team.
    </p>

    <!-- Status Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px;">
      <tr>
        <td style="padding: 24px; background-color: ${statusBg}; border-radius: 12px; border: 1px solid ${statusBorder};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Status</p>
                <p style="margin: 0 0 20px; color: ${statusColor}; font-size: 16px; font-weight: 700;">
                  <span style="margin-right: 6px;">${statusIcon}</span> ${isApproved ? "Approved" : "Rejected"}
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Amount</p>
                <p style="margin: 0; color: #f8fafc; font-size: 28px; font-weight: 700;">$${amount.toFixed(2)}</p>
              </td>
            </tr>
            ${adminNote ? `
            <tr>
              <td style="padding-top: 16px; border-top: 1px solid ${statusBorder}; margin-top: 16px;">
                <p style="margin: 16px 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Admin Note</p>
                <p style="margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.5; font-style: italic;">"${adminNote}"</p>
              </td>
            </tr>
            ` : ""}
          </table>
        </td>
      </tr>
    </table>

    <!-- Next Steps -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 16px; background-color: #0f172a; border-radius: 8px; border: 1px solid #1e293b;">
          <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
            <span style="color: #f59e0b; font-weight: 600;">Next steps:</span>
            ${isApproved
              ? " Your funds will be transferred to your account shortly. Check your dashboard for updates."
              : " If you have questions about this decision, please reach out to support through your dashboard."
            }
          </p>
        </td>
      </tr>
    </table>

    <!-- Dashboard CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 0;">
      <tr>
        <td align="center">
          <a href="${APP_URL}/withdrawals" style="display: inline-block; padding: 12px 32px; background-color: #1e293b; color: #e2e8f0; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; border: 1px solid #334155;">
            View Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Withdrawal ${isApproved ? "Approved" : "Rejected"} - PipZen Partners`,
    html: emailWrapper(content),
  });

  if (error) {
    console.error("Resend withdrawal email error:", error);
    throw new Error(error.message || "Failed to send withdrawal email");
  }
}
