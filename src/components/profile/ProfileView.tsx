"use client";

import * as React from "react";
import Link from "next/link";
import {
  Trophy,
  Flame,
  Gauge,
  Flag,
  Calendar,
  Sparkles,
  ShieldCheck,
  Award,
  Zap,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RacerCar } from "@/components/animated/RacerCar";
import type { PlayerColor } from "@/types/race";

interface ProfileData {
  username: string;
  isSelf: boolean;
  level: number;
  title: string;
  memberSince: string;
  bestWpm: number;
  averageWpm: number;
  accuracy: number;
  totalRaces: number;
  victories: number;
  podiums: number;
  carColor: PlayerColor;
  recentRaces: Array<{
    id: string;
    date: string;
    category: string;
    wpm: number;
    accuracy: number;
    rank: number;
  }>;
}

const SELF_PROFILE: ProfileData = {
  username: "TurboTypist",
  isSelf: true,
  level: 18,
  title: "Pilote Vitesse Grand V",
  memberSince: "Février 2025",
  bestWpm: 108,
  averageWpm: 76,
  accuracy: 98.4,
  totalRaces: 284,
  victories: 64,
  podiums: 138,
  carColor: "azure",
  recentRaces: [
    { id: "r1", date: "Il y a 2h", category: "Code TypeScript", wpm: 104, accuracy: 99.2, rank: 1 },
    { id: "r2", date: "Il y a 5h", category: "Citations", wpm: 88, accuracy: 97.8, rank: 2 },
    { id: "r3", date: "Hier", category: "Théâtre Molière", wpm: 82, accuracy: 98.5, rank: 1 },
    {
      id: "r4",
      date: "Il y a 2 jours",
      category: "Code TypeScript",
      wpm: 96,
      accuracy: 96.9,
      rank: 3,
    },
  ],
};

const OTHER_PROFILE: ProfileData = {
  username: "PixelDriver",
  isSelf: false,
  level: 14,
  title: "As du Clavier",
  memberSince: "Janvier 2025",
  bestWpm: 92,
  averageWpm: 68,
  accuracy: 97.1,
  totalRaces: 195,
  victories: 38,
  podiums: 89,
  carColor: "tangerine",
  recentRaces: [
    { id: "r1", date: "Il y a 1h", category: "Citations", wpm: 75, accuracy: 96.5, rank: 2 },
    { id: "r2", date: "Il y a 3h", category: "Code TypeScript", wpm: 88, accuracy: 98.0, rank: 1 },
    { id: "r3", date: "Hier", category: "Proverbes", wpm: 70, accuracy: 97.2, rank: 2 },
    { id: "r4", date: "Il y a 3 jours", category: "Citations", wpm: 78, accuracy: 95.8, rank: 4 },
  ],
};

interface ProfileViewProps {
  initialUsername?: string;
}

export function ProfileView({ initialUsername }: ProfileViewProps) {
  // Toggle between viewing self vs viewing another player to test both states easily
  const [viewMode, setViewMode] = React.useState<"self" | "other">(
    initialUsername && initialUsername.toLowerCase() !== "turbotypist" ? "other" : "self"
  );
  const [equippedColor, setEquippedColor] = React.useState<PlayerColor>("azure");

  const currentData = viewMode === "self" ? SELF_PROFILE : OTHER_PROFILE;
  const displayedUsername = initialUsername || currentData.username;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Perspective Toggle Bar (for testing/previewing both views) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-100/70 p-3 text-xs font-bold text-zinc-600">
        <span className="flex items-center gap-1.5 font-black text-zinc-700 uppercase">
          <Sparkles className="text-tangerine-orange h-4 w-4" />
          Aperçu de la vue profil :
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("self")}
            className={`cursor-pointer rounded-full px-3 py-1 font-black transition-all ${
              viewMode === "self"
                ? "bg-electric-lime border-slate-dark text-slate-dark border-2 shadow-xs"
                : "bg-white text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            👤 Mon Profil (TurboTypist)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("other")}
            className={`cursor-pointer rounded-full px-3 py-1 font-black transition-all ${
              viewMode === "other"
                ? "bg-azure-blue border-slate-dark border-2 text-white shadow-xs"
                : "bg-white text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            👥 Profil d&apos;un autre joueur (PixelDriver)
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="border-slate-dark arcade-shadow flex flex-col items-center justify-between gap-6 rounded-3xl border-3 bg-white p-6 sm:p-8 md:flex-row">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {/* Driver Avatar / Equipped Car */}
          <div className="border-slate-dark arcade-shadow relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-3 bg-zinc-50 p-2">
            <RacerCar
              color={viewMode === "self" ? equippedColor : currentData.carColor}
              width={80}
              height={40}
              showSmoke={false}
              showHeadlight={false}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-slate-dark text-3xl font-black uppercase sm:text-4xl">
                {displayedUsername}
              </h1>
              <Badge variant={viewMode === "self" ? "lime" : "azure"} className="text-xs">
                Niveau {currentData.level}
              </Badge>
            </div>

            <p className="text-slate-dark text-sm font-black">{currentData.title}</p>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-zinc-500 sm:justify-start">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                Membre depuis {currentData.memberSince}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="text-victory-teal h-3.5 w-3.5" />
                Pilote Vérifié (Anonymat protégé)
              </span>
            </div>
          </div>
        </div>

        {/* Profile Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {viewMode === "self" ? (
            <>
              <Link href="/lobby">
                <Button variant="lime" size="md" pulse={true} className="gap-2 text-xs">
                  <Zap className="fill-slate-dark h-4 w-4" /> Rejoindre une Course
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/lobby">
                <Button variant="azure" size="md" className="gap-2 text-xs">
                  <Swords className="h-4 w-4" /> Défier en Duel
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Arcade Key Stats Overview Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {/* Record WPM */}
        <div className="border-slate-dark arcade-shadow flex flex-col rounded-2xl border-3 bg-white p-4">
          <div className="bg-electric-lime/40 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2">
            <Flame className="text-slate-dark h-5 w-5" />
          </div>
          <span className="text-[11px] font-black text-zinc-500 uppercase">Record Vitesse</span>
          <span className="text-slate-dark font-mono text-2xl font-black">
            {currentData.bestWpm} <span className="text-xs text-zinc-400">WPM</span>
          </span>
        </div>

        {/* Average WPM */}
        <div className="border-slate-dark arcade-shadow flex flex-col rounded-2xl border-3 bg-white p-4">
          <div className="bg-azure-blue/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2">
            <Gauge className="text-azure-blue h-5 w-5" />
          </div>
          <span className="text-[11px] font-black text-zinc-500 uppercase">Moyenne</span>
          <span className="text-slate-dark font-mono text-2xl font-black">
            {currentData.averageWpm} <span className="text-xs text-zinc-400">WPM</span>
          </span>
        </div>

        {/* Accuracy */}
        <div className="border-slate-dark arcade-shadow flex flex-col rounded-2xl border-3 bg-white p-4">
          <div className="bg-victory-teal/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2">
            <ShieldCheck className="text-victory-teal h-5 w-5" />
          </div>
          <span className="text-[11px] font-black text-zinc-500 uppercase">Précision</span>
          <span className="text-slate-dark font-mono text-2xl font-black">
            {currentData.accuracy}%
          </span>
        </div>

        {/* Total Races */}
        <div className="border-slate-dark arcade-shadow flex flex-col rounded-2xl border-3 bg-white p-4">
          <div className="bg-tangerine-orange/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2">
            <Flag className="text-tangerine-orange h-5 w-5" />
          </div>
          <span className="text-[11px] font-black text-zinc-500 uppercase">Courses</span>
          <span className="text-slate-dark font-mono text-2xl font-black">
            {currentData.totalRaces}
          </span>
        </div>

        {/* Victories */}
        <div className="border-slate-dark arcade-shadow col-span-2 flex flex-col rounded-2xl border-3 bg-white p-4 md:col-span-1">
          <div className="bg-arcade-magenta/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2">
            <Trophy className="text-arcade-magenta h-5 w-5" />
          </div>
          <span className="text-[11px] font-black text-zinc-500 uppercase">Victoires</span>
          <span className="text-slate-dark font-mono text-2xl font-black">
            {currentData.victories}
          </span>
        </div>
      </div>

      {/* Driver Garage & Customization (when viewing own profile) */}
      {viewMode === "self" && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl">Garage du Pilote</CardTitle>
            <CardDescription>
              Choisissez la couleur de carrosserie de votre bolide pour les courses multijoueur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(
                [
                  { id: "azure", name: "Bolide Azure", color: "azure" },
                  { id: "tangerine", name: "Turbo Tangerine", color: "tangerine" },
                  { id: "magenta", name: "Fantôme Magenta", color: "magenta" },
                  { id: "teal", name: "Foudre Teal", color: "teal" },
                ] as const
              ).map((car) => {
                const isSelected = equippedColor === car.color;
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => setEquippedColor(car.color)}
                    className={`border-slate-dark arcade-shadow flex cursor-pointer flex-col items-center rounded-2xl border-3 p-4 transition-all ${
                      isSelected
                        ? "bg-electric-lime/20 ring-electric-lime ring-3"
                        : "bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="mb-2 flex h-14 w-full items-center justify-center">
                      <RacerCar
                        color={car.color}
                        width={68}
                        height={34}
                        showSmoke={false}
                        showHeadlight={false}
                      />
                    </div>
                    <span className="text-slate-dark text-xs font-black uppercase">{car.name}</span>
                    <Badge variant={isSelected ? "lime" : "outline"} className="mt-2 text-[10px]">
                      {isSelected ? "Équipé" : "Choisir"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Race History Table */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="text-tangerine-orange h-5 w-5" />
            Historique Récent des Courses
          </CardTitle>
          <CardDescription>Dernières performances enregistrées sur l&apos;arène</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-zinc-200 text-zinc-400 uppercase">
                  <th className="py-2.5 pr-4 font-black">Date</th>
                  <th className="py-2.5 pr-4 font-black">Catégorie</th>
                  <th className="py-2.5 pr-4 font-black">Vitesse</th>
                  <th className="py-2.5 pr-4 font-black">Précision</th>
                  <th className="py-2.5 font-black">Rang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-bold">
                {currentData.recentRaces.map((race) => (
                  <tr key={race.id} className="hover:bg-zinc-50">
                    <td className="py-3 pr-4 text-zinc-500">{race.date}</td>
                    <td className="py-3 pr-4 font-black text-slate-900">{race.category}</td>
                    <td className="py-3 pr-4 font-mono font-black text-slate-900">
                      <span className="text-azure-blue">{race.wpm}</span> WPM
                    </td>
                    <td className="text-victory-teal py-3 pr-4 font-mono font-black">
                      {race.accuracy}%
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={race.rank === 1 ? "lime" : race.rank === 2 ? "azure" : "outline"}
                        className="text-[11px]"
                      >
                        {race.rank === 1
                          ? "1er 🥇"
                          : race.rank === 2
                            ? "2e 🥈"
                            : `${race.rank}e 🥉`}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Badges and Achievements Gallery */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Award className="text-arcade-magenta h-5 w-5" />
            Succès & Trophées Débloqués
          </CardTitle>
          <CardDescription>Exploits accomplis sur CodeRacer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="border-slate-dark flex flex-col items-center rounded-2xl border-2 bg-zinc-50 p-3 text-center">
              <span className="text-2xl">⚡</span>
              <span className="text-slate-dark mt-1 text-xs font-black uppercase">
                Club 100 WPM
              </span>
              <span className="text-[10px] font-semibold text-zinc-500">Dépassé les 100 WPM</span>
            </div>
            <div className="border-slate-dark flex flex-col items-center rounded-2xl border-2 bg-zinc-50 p-3 text-center">
              <span className="text-2xl">🎯</span>
              <span className="text-slate-dark mt-1 text-xs font-black uppercase">
                Précision Parfaite
              </span>
              <span className="text-[10px] font-semibold text-zinc-500">
                100% sans aucune faute
              </span>
            </div>
            <div className="border-slate-dark flex flex-col items-center rounded-2xl border-2 bg-zinc-50 p-3 text-center">
              <span className="text-2xl">🏆</span>
              <span className="text-slate-dark mt-1 text-xs font-black uppercase">
                Roi de l&apos;Arène
              </span>
              <span className="text-[10px] font-semibold text-zinc-500">
                50 victoires multijoueur
              </span>
            </div>
            <div className="border-slate-dark flex flex-col items-center rounded-2xl border-2 bg-zinc-50 p-3 text-center">
              <span className="text-2xl">🏎️</span>
              <span className="text-slate-dark mt-1 text-xs font-black uppercase">
                Pilote Assidu
              </span>
              <span className="text-[10px] font-semibold text-zinc-500">Plus de 200 courses</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
