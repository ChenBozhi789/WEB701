using Microsoft.AspNetCore.Identity;

namespace Blazor_Charity.Data
{
    public sealed class AppNoOpEmailSender : IEmailSender<ApplicationUser>
    {
        public Task SendConfirmationLinkAsync(ApplicationUser u, string email, string link) => Task.CompletedTask;
        public Task SendPasswordResetLinkAsync(ApplicationUser u, string email, string link) => Task.CompletedTask;
        public Task SendPasswordResetCodeAsync(ApplicationUser u, string email, string code) => Task.CompletedTask;
    }
}
