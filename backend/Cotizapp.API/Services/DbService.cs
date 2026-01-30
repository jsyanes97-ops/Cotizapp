using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;

namespace Cotizapp.API.Services
{
    public class DbService
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public DbService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") 
                                ?? throw new Exception("Connection string 'DefaultConnection' not found.");
        }

        public IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        public async Task<T> GetAsync<T>(string sp, object parms)
        {
            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<T>(sp, parms, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<T>> GetAllAsync<T>(string sp, object parms)
        {
            using var connection = CreateConnection();
            return await connection.QueryAsync<T>(sp, parms, commandType: CommandType.StoredProcedure);
        }

        public async Task<int> EditData(string sp, object parms)
        {
            using var connection = CreateConnection();
            return await connection.ExecuteAsync(sp, parms, commandType: CommandType.StoredProcedure);
        }
        
        public async Task<T> EditDataReturnObject<T>(string sp, object parms)
        {
             using var connection = CreateConnection();
             // Often we want the ID back or the whole object. 
             // Assuming SP does "SELECT ..." at end or we use QuerySingle
             return await connection.QueryFirstOrDefaultAsync<T>(sp, parms, commandType: CommandType.StoredProcedure);
        }
    }
}
