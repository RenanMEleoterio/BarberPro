using System;

namespace BarbeariaSaaS.Services
{
    public static class AppDateTime
    {
        private static readonly TimeSpan DefaultBrazilOffset = TimeSpan.FromHours(-3);

        public static DateTime UtcNow()
        {
            return DateTime.UtcNow;
        }

        public static DateTime NormalizeClientDateTimeToUtc(DateTime value)
        {
            if (value.Kind == DateTimeKind.Utc)
            {
                return value;
            }

            if (value.Kind == DateTimeKind.Local)
            {
                return value.ToUniversalTime();
            }

            var unspecifiedValue = DateTime.SpecifyKind(value, DateTimeKind.Unspecified);
            return new DateTimeOffset(unspecifiedValue, DefaultBrazilOffset).UtcDateTime;
        }

        public static DateTime MarkAsUtc(DateTime value)
        {
            return value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }

        public static DateTime CreateUtcDate(int year, int month, int day)
        {
            return new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);
        }

        public static DateTime StartOfWeekUtc(DateTime referenceUtc)
        {
            var utcReference = referenceUtc.Kind == DateTimeKind.Utc ? referenceUtc : referenceUtc.ToUniversalTime();
            var start = utcReference.Date.AddDays(-(int)utcReference.Date.DayOfWeek);
            return MarkAsUtc(start);
        }

        public static DateTime CreateUtcSlot(DateTime date, TimeSpan time)
        {
            return MarkAsUtc(date.Date.Add(time));
        }
    }
}
