using Blazor_Charity.Data;
using Microsoft.EntityFrameworkCore;
using System;

public class ProductService
{
    private readonly ApplicationDbContext _db;
    public ProductService(ApplicationDbContext db) => _db = db;

    public Task<List<Item>> GetAllAsync() => _db.Items.AsNoTracking().ToListAsync();

    public async Task AddAsync(Item item)
    {
        _db.Items.Add(item);
        await _db.SaveChangesAsync();
    }
}
