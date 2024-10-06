<template>
  <div class="container mx-auto">
    <form novalidate @submit.prevent="login" class="mb-8 bg-gray-100 p-8 flex flex-col gap-4 max-w-sm mx-auto">
      <h1 class="font-bold text-2xl">Get Toggl data</h1>
      <div>
        <label for="email" class="block text-sm font-medium leading-6 text-gray-900">Email</label>
        <div class="mt-2">
          <input type="email" name="email" id="email" v-model="email" class="block w-full rounded-md border-0 py-1.5 px-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label for="email" class="block text-sm font-medium leading-6 text-gray-900">Password</label>
        <div class="mt-2">
          <input type="password" name="email" id="email" v-model="password" class="block w-full rounded-md border-0 py-1.5 px-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="password" />
        </div>
      </div>
      <button type="submit" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Login</button>
    </form>
    <div v-for="project in projects">
      <h2 class="text-2xl font-semibold mb-2">{{ project.name}}</h2>
      <table class="min-w-full divide-y divide-gray-300 mb-8">
        <thead class="bg-gray-50">
        <tr class="divide-x divide-gray-300">
          <th scope="col" class="py-3.5 pl-4 w-96 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Description</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Monday</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tuesday</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Wedsday</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Thursday</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Friday</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Saturday</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Sunday</th>
        </tr>
        </thead>
        <tr v-for="entry in groupByDescriptionAndWeek(getEntries(project.id ))" class="even:bg-gray-50 divide-x">
          <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">{{ entry.description }}</td>
          <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 tabular-nums" :class="{ 'text-center text-gray-400' : !day.duration }" v-for="day in entry.dates" align="right">{{ day.duration ? parseFloat(day.duration).toFixed(2) : '-' }}</td>
        </tr>

      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import {$fetch} from "ofetch";

const email = ref()
const password = ref()

const projects = ref([])
const time_entries = ref([])

async function login(){

  const data = await $fetch('/api/auth/login', {
    method: 'post',
    body: {
      email: email.value,
      password: password.value
    }
  })

  projects.value = data.projects
  time_entries.value = data.time_entries
}

function getEntries(project_id: number){
  return time_entries.value.filter(entry => entry.project_id === project_id)
}

const formatDayOfWeek = (dateStr: string) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
  return new Intl.DateTimeFormat('en-US', options).format(date); // Returner ugedagen som navn (fx. "Monday")
};

// Funktion til at filtrere datoer ældre end 8 dage og gruppere efter beskrivelse og dato
const groupByDescriptionAndWeek = (entries: Entry[]) => {
  const result: { description: string; dates: { day: string; duration: number | null }[] }[] = [];

  const today = new Date();

  const groupedByDescription = entries.reduce((acc: any, entry) => {
    const entryDate = new Date(entry.start.split('T')[0]);
    const diffInDays = (today.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);

    // Kun inkludér datoer der er indenfor de sidste 8 dage
    if (diffInDays <= 8) {
      const dayOfWeek = formatDayOfWeek(entry.start);
      const description = entry.description;

      if (!acc[description]) {
        acc[description] = {
          description,
          dates: {
            "Monday": null,
            "Tuesday": null,
            "Wednesday": null,
            "Thursday": null,
            "Friday": null,
            "Saturday": null,
            "Sunday": null,
          },
        };
      }

      // Tilføj varighed for den pågældende dag
      acc[description].dates[dayOfWeek] = (acc[description].dates[dayOfWeek] || 0) + entry.duration / 3600; // Konverter til decimal timer
    }

    return acc;
  }, {});

  // Omdan til det ønskede array-format
  for (const key in groupedByDescription) {
    const datesArray = Object.entries(groupedByDescription[key].dates).map(([day, duration]) => ({
      day,
      duration: duration || null,
    }));

    result.push({
      description: key,
      dates: datesArray,
    });
  }

  return result;
};

</script>

<style scoped></style>
