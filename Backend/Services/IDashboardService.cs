using System.Threading.Tasks;

namespace BarbeariaSaaS.Services
{
    public interface IDashboardService
    {
        Task<object> GetClientDashboardAsync(int clienteId);
        Task<object> GetBarberDashboardAsync(int barbeiroId);
        Task<object> GetManagerDashboardAsync(int barbeariaId);
        Task<object> GetManagerBarbersAsync(int barbeariaId, int userId);
    }
}
