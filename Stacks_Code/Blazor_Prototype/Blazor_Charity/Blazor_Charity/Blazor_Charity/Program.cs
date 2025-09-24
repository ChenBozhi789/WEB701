using Blazor_Charity;
using Blazor_Charity.Components;
using Blazor_Charity.Components.Account;                  // IdentityUserAccessor / IdentityRedirectManager
using Blazor_Charity.Data;
using Microsoft.AspNetCore.Components.Authorization;       // PersistingRevalidatingAuthenticationStateProvider
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Components;

var builder = WebApplication.CreateBuilder(args);

// database context
var cs = builder.Configuration.GetConnectionString("DefaultConnection")
         ?? throw new InvalidOperationException("Missing DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseNpgsql(cs));

// identity
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(o =>
    {
        o.SignIn.RequireConfirmedAccount = false;
        o.User.RequireUniqueEmail = true;
        // o.Password.RequiredLength = 6;
        // o.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

// Dependencies required for the Register page
builder.Services.AddCascadingAuthenticationState();
builder.Services.AddScoped<IdentityUserAccessor>();
builder.Services.AddScoped<IdentityRedirectManager>();
builder.Services.AddScoped<AuthenticationStateProvider, PersistingRevalidatingAuthenticationStateProvider>();
builder.Services.AddSingleton<IEmailSender<ApplicationUser>, AppNoOpEmailSender>();

// Make the component injectable with HttpClient
builder.Services.AddHttpClient();
builder.Services.AddScoped<HttpClient>(sp =>
{
    var nav = sp.GetRequiredService<NavigationManager>();
    return new HttpClient { BaseAddress = new Uri(nav.BaseUri) };
});

// api controllers
builder.Services.AddControllers();

// blazor
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddInteractiveWebAssemblyComponents();

builder.Services.AddDatabaseDeveloperPageExceptionFilter();

builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<TokenService>();

// CORS
const string ClientCors = "ClientCors";
builder.Services.AddCors(opt =>
{
    opt.AddPolicy(ClientCors, p => p
        .WithOrigins("https://localhost:5001", "http://localhost:5000", "https://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var roleMgr = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var r in new[] { "Member", "Beneficiary" })
        if (!await roleMgr.RoleExistsAsync(r))
            await roleMgr.CreateAsync(new IdentityRole(r));
}

// data migration and seed
using (var scope = app.Services.CreateScope())
{
    var sp = scope.ServiceProvider;
    var db = sp.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();

    var roleMgr = sp.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var r in new[] { "Member", "Beneficiary", "Admin" })
        if (!await roleMgr.RoleExistsAsync(r))
            await roleMgr.CreateAsync(new IdentityRole(r));

    var userMgr = sp.GetRequiredService<UserManager<ApplicationUser>>();
    async Task<ApplicationUser> Ensure(string email, string role, int balance)
    {
        var u = await userMgr.FindByEmailAsync(email);
        if (u != null) return u;
        u = new ApplicationUser { UserName = email, Email = email, EmailConfirmed = true, TokenBalance = balance };
        await userMgr.CreateAsync(u, "Passw0rd!");
        await userMgr.AddToRoleAsync(u, role);
        return u;
    }
    var member = await Ensure("member@test.com", "Member", 0);
    await Ensure("bene@test.com", "Beneficiary", 50);

    if (!await db.Items.AnyAsync())
    {
        db.Items.Add(new Item { Name = "Bread Pack", Category = "Food", Quantity = 10, OwnerId = member.Id, Time = DateTime.UtcNow });
        await db.SaveChangesAsync();
    }
}

// middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseWebAssemblyDebugging();
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors(ClientCors);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.UseAntiforgery();

// blazor
app.MapRazorComponents<App>()
   .AddInteractiveServerRenderMode()
   .AddInteractiveWebAssemblyRenderMode()
   .AddAdditionalAssemblies(typeof(Blazor_Charity.Client._Imports).Assembly);

// web API
app.MapControllers();

// identity endpoints
app.MapAdditionalIdentityEndpoints();

app.Run();
