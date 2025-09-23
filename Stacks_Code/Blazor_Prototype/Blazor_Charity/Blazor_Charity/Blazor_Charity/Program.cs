using Blazor_Charity;
using Blazor_Charity.Components;
using Blazor_Charity.Components.Account;                  // IdentityUserAccessor / IdentityRedirectManager
using Blazor_Charity.Data;
using Microsoft.AspNetCore.Components.Authorization;       // PersistingRevalidatingAuthenticationStateProvider
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ================= DB =================
var cs = builder.Configuration.GetConnectionString("DefaultConnection")
         ?? throw new InvalidOperationException("Missing DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseNpgsql(cs));

// ================= Identity（含角色）=================
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(o =>
    {
        o.SignIn.RequireConfirmedAccount = true;
        o.User.RequireUniqueEmail = true;
        // 视需要放宽密码策略
        // o.Password.RequiredLength = 6;
        // o.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

// ！！！Register 页面需要的依赖（缺它们会报 RedirectManager/Accessor 未注册的异常）
builder.Services.AddCascadingAuthenticationState();
builder.Services.AddScoped<IdentityUserAccessor>();
builder.Services.AddScoped<IdentityRedirectManager>();
builder.Services.AddScoped<AuthenticationStateProvider, PersistingRevalidatingAuthenticationStateProvider>();
builder.Services.AddSingleton<IEmailSender<ApplicationUser>, AppNoOpEmailSender>();

// ================= API Controllers =================
builder.Services.AddControllers();

// ================= Blazor =================
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddInteractiveWebAssemblyComponents();

builder.Services.AddDatabaseDeveloperPageExceptionFilter();

// ================= 业务服务 =================
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<TokenService>();

// ================= CORS（按需调整端口）=================
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

// ================= 数据迁移与种子 =================
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

// ================= 中间件管道 =================
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

// 防伪：必须在 Auth 之后、MapRazorComponents/Controllers 之前
app.UseAntiforgery();

// Blazor（Server + WASM 托管）
app.MapRazorComponents<App>()
   .AddInteractiveServerRenderMode()
   .AddInteractiveWebAssemblyRenderMode()
   .AddAdditionalAssemblies(typeof(Blazor_Charity.Client._Imports).Assembly);

// Web API
app.MapControllers();

// Identity 端点（/Account/Register, /Account/Login 等）
app.MapAdditionalIdentityEndpoints();

app.Run();
